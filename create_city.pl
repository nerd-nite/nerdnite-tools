#!/usr/bin/env perl
use strict;
use warnings;
use cPanel::PublicAPI;
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

We have just created (or updated) a forwarder from $city\@nerdnite.com to all of the bosses of this city.

You don't have to do anything; just know that emails to your Nerd Nite address will now arrive here. If you do spam filtering, you may need to set up
a whitelist to let these emails through.

If you'd like to switch to a dedicated mailbox, just email me at dan\@nerdnite.com and I can switch things over for you.

Thanks,

Dan
END_OF_MESSAGE

foreach my $external_email (@bosses) {
		my $transport = Email::Sender::Transport::SMTP->new({
    		host	=> 'lizziebracken.com',
    		port 	=> 465,
    		ssl		=> 1,
    		sasl_username	=> 'dan+nerdnite.com',
    		sasl_password	=> 's4tgd1tw',
    		
  		});
  		my $email = Email::Simple->create(
  			header 	=> [
			 	To		=> $external_email,
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

	my $params = {
		domain => 'nerdnite.com',
		email  => $email,
	};
	$params->{fwdopt} = 'fwd';

	foreach my $target ( @{$targets} ) {
		$params->{fwdemail} = $target;
		my $result = send_cpanel_request( 'Email', 'addforward', $params );
		print STDERR Dumper($result);
	}
}

sub send_cpanel_request {
	state $cp = cPanel::PublicAPI->new(
		'user'   => 'nerdnite',
		'pass'   => 's4tgd1tw',
		'host'   => 'lizziebracken.com',
		'usessl' => 1,
		'debug'		=> 1,
	) || croak "Could not create cPanel connection: $!";
	state $json = JSON->new->allow_nonref;

	my $module   = shift;
	my $function = shift;
	my $params   = shift;

	my $result = $cp->cpanel_api2_request(
		'cpanel',
		{
			'module' => $module,
			'func'   => $function,
		},
		$params, 'json'
	);
	print STDERR Dumper($result);
	return $json->decode($result)->{cpanelresult};
}
