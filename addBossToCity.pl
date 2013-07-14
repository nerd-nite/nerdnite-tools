#!/usr/bin/env perl
use strict;
use warnings;
use NerdNite::Email;
use JSON;
use Carp;
use Email::Sender::Simple qw(sendmail);
use Email::Sender;
use Email::Sender::Transport::SMTP;
use Readonly;
use Data::Dumper;
use feature 'state';

Readonly my $DEFAULT_QUOTA => 250;

my $city = shift || "Please provide city name\n";

my @bosses = map { "$_\@nerdnite.com" } @ARGV;
print Dumper(\@bosses);

print $city;


create_forwarders($city, \@bosses);

my $message = <<"END_OF_MESSAGE";			
Hello,

We have just created (or updated) a forwarder from $city\@nerdnite.com to this email address, because you're a boss of this city.

You don't have to do anything; just know that emails to your Nerd Nite address will now arrive here. If you do spam filtering, you may need to set up
a whitelist to let these emails through.

If you have any questions, just email me at dan\@nerdnite.com.

Thanks,

Dan
END_OF_MESSAGE

foreach my $external_email (@bosses) {
	my $transport = Email::Sender::Transport::SMTP->new({
		host		=> 'smtp.gmail.com',
		port 		=> 465,
		ssl		=> 1,
		sasl_username	=> 'nn.dan.rumney@gmail.com',
		sasl_password	=> 's4tgd1tw',		
	});
	my $email = Email::Simple->create(
		header 	=> [
			To	=> $external_email,
			From	=> 'web@nerdnite.com',
			Subject	=> 'New Nerd Nite Mailbox',
		 ],
		 body	=> $message,
	);
	
	sendmail($email, { transport => $transport}) or croak  "Mail fail";
}



sub create_forwarders {
	my $email   = shift;
	my $targets = shift;
	my $nnEmail = NerdNite::Email->new();

	foreach my $target ( @{$targets} ) {
		my $result = $nnEmail->addForward( $email => $target );
		print STDERR Dumper($result);
	}
}
