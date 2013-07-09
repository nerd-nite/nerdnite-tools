use strict;
use warnings;
use NerdNite::Email;
use Carp;

use Data::Dumper;

use Email::Sender::Simple qw(sendmail);
use Email::Sender;
use Email::Sender::Transport::SMTP;
use Log::Log4perl;


Log::Log4perl::init('./perlLogging.conf');
my $logger = Log::Log4perl->get_logger('com.nerdnite.tools.sendEmailToMailboxOwners');

my $message = shift || croak "Please provide a message for sending to the mailbox owners.";

if( $message eq '-') {
	print "Reading message from STDIN\n";
		$message = do { local $/; <STDIN> };
}

#my $emailChecker = NerdNite::Email->new();
#my $emails = $emailChecker->getAllMailBoxes();

#print Dumper($emails);

create_email(['dancrumb@gmail.com'], $message, $logger);


sub create_email {
	my $recipients = shift;
	my $message = shift;
	my $logger = shift;
	

	foreach my $external_email (@{$recipients}) {
		my $transport = Email::Sender::Transport::SMTP->new({
		host	=> 'smtp.gmail.com',
		port 	=> 465,
		ssl		=> 1,
		sasl_username	=> 'nn.dan.rumney@gmail.com',
		sasl_password	=> 's4tgd1tw',
		
		});
		my $email = Email::Simple->create(
			header 	=> [
				To		=> $external_email,
				From	=> 'dan@nerdnite.com',
				Subject	=> 'Nerd Nite Mailbox Migration',
			 ],
			 body	=> $message,
			);
		sendmail($email, { transport => $transport}) or croak  "Mail fail";
	}
}